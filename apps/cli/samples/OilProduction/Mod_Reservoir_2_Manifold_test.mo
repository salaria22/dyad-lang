  model Mod_Reservoir_2_Manifold_test
    // Model of Reservoir-to-Manifold
    // author: 	Bernt Lie
    //			University of South-Eastern Norway
	//			December 15, 2023
	//
	// Model constants
	constant Real PI = 3.151592654 "pi";
	constant Real g = 9.81 "Acceleration of gravity, m/s2";
	constant Real f__s = 60 "ESP nominal frequency, Hz";
	constant Real Vd__s = 1 "ESP scaling volumetric flowrate, m3/s";
	constant Real p__s = 1e5 "Scaling pressure, Pa";
	constant Real rho__s = 1e3 "Scaling density, kg/m3";
	// Model parameters
	parameter Real ell_m = 100 "Length of pipe below pump, m";
	parameter Real ell_p = 2000 "Length of pipe above pump, m";
	parameter Real ell = ell_m + ell_p "Total length of pipe, m";
	parameter Real h = ell "Hight difference from input to output, m";
	parameter Real d = 0.1569 "Vertical pipe diameter, m";
	parameter Real A = PI*d^2/4 "Vertical pipe cross sectional area, m2";
	parameter Real V = A*ell "Volume of pipe, m3";
	
	parameter Real beta_T = 1/1.5e9 "Isothermal compressibility of fluid, 1/Pa";
	parameter Real p_beta_0 = 1e5 "Nominal fluid pressure, Pa";
	parameter Real rho_o = 900 "Density of oil, kg/m3";
	parameter Real rho_w = 1e3 "Density of water, kg/m3";
	parameter Real nu_o = 100e-6 "Kinematic viscosity oil, m2/s";
	parameter Real nu_w = 1e-6 "Kinematic viscosity water, m2/s";
	
	parameter Real eps = 45.7e-6 "Pipe roughness dimension, m";
	parameter Real h_p__s = 1210.6 "ESP scaling head, m";
	parameter Real a_1 = -37.57 "ESP coefficient, -";
	parameter Real a_2 = 2.864e3 "ESP coefficient, -";
	parameter Real a_3 = -8.668e4 "ESP coefficient, -";
	
	parameter Real md_v__c = 25.9e3/3600 "Choke valve capacity, kg/s";
	parameter Real Vd_pi__c = 7e-4 "Productivity Index capacity, m3/s";
	
	// Initial state parameters
	parameter Real Vd_v0 = 23.15e-3 "Initial vertical pipe flowrate, m3/s";
	//
	// Declaring variables
	// -- differential variables
	Real Vd_v(start = Vd_v0, fixed = true) "Initializing vertical volumetric flow rate, m3/s";
	// -- depending on inputs
	Real rho_beta_0 "Mixture density, kg/m3";
	Real nu "Mixture kinematic viscosity, m2/s";
	Real mu "Mixture dynamic viscosity, Pa.s";
	// -- algebraic variables
	Real p_c__i "Choke inlet pressure, Pa";
	Real p_h "Heel pressure, Pa";
	Real md_v "Vertical pipe mass flow rate, kg/s";

	Real rho_v "Vertical pipe density, kg/m3";
	Real v_v "Vertical pipe velocity, m/s";
	
	Real Dp_p "Pump pressure increase, Pa";
	Real Dp_f "Friction pressure drop, Pa";
	Real h_p "ESP head, m";
	Real f_D "Darcy friction factor,-";
	Real N_Re "Reynolds number, -";
	Real Dp_g "Gravity pressure, Pa";
	// 
	// -- input variables
	input Real p_f "Reservoir formation pressure, Pa";
	input Real p_m "Manifold pressure, Pa";
	input Real f_p "Pump rotational frequency, Hz";
	input Real chi_w "Water cut, -";
	//input Real u_c "Choke valve opening, -";
  // Equations constituting the model
  equation
	// Balance equations
	der(Vd_v) = A*(p_h - p_c__i + Dp_p - Dp_f - rho_v*g*h)/(rho_v*ell);
	// Algebraic equations
	// -- depending on inputs
	rho_beta_0 = chi_w*rho_w + (1-chi_w)*rho_o;
	nu = chi_w*nu_w + (1-chi_w)*nu_o;
	mu = rho_beta_0*nu;
	//
	rho_v = rho_beta_0*exp(beta_T*(p_c__i-p_beta_0));
	
	p_h = p_f - p__s*Vd_v/Vd_pi__c;
	md_v = rho_v*Vd_v;
	p_c__i = p_m + p__s*rho_v/rho__s*(md_v/md_v__c)^2;
	h_p = h_p__s*( (f_p/f__s)^2 + a_1*(f_p/f__s)*Vd_v/Vd__s
			+ a_2*(Vd_v/Vd__s)^2 + a_3*(f__s/f_p)*(Vd_v/Vd__s)^3);
	Dp_p = rho_v*g*h_p;
	v_v = Vd_v/A;
	N_Re = rho_v*v_v*d/mu;
	f_D = (-1/2/log10(5.74/N_Re^0.9 + eps/d/3.7))^2;
	Dp_f = ell*f_D*rho_v/2*v_v^2/d;
	Dp_g = rho_v*g*h;
	//
  end Mod_Reservoir_2_Manifold_test;
