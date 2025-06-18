  model Mod_Reservoir_2_Manifold
    // Model of Reservoir-to-Manifold
    // author: 	Bernt Lie
    //			University of South-Eastern Norway
	//			September 16, 2022
	//
	// Parameters
	constant Real PI = 3.151592654;
	constant Real g = 9.81 "Acceleration of gravity, m/s2";
	//
	parameter Real ellm = 100 "Length of pipe below pump, m";
	parameter Real ellp = 2000 "Length of pipe above pump, m";
	parameter Real ell = ellm + ellp "Total length of pipe, m";
	parameter Real h = ell "Hight difference from input to output, m";
	parameter Real d = 0.1569 "Vertical pipe diameter, m";
	parameter Real A = PI*d^2/4 "Vertical pipe cross sectional area, m2";
	parameter Real V = A*ell "Volume of pipe, m3";
	parameter Real beta_T = 1/1.5e9 "Isothermal compressibility of fluid, Pa^(-1)";
	parameter Real p_beta_0 = 1e5 "Nominal fluid pressure, Pa";
	parameter Real rho_o = 900 "Density of oil, kg/m3";
	parameter Real rho_w = 1e3 "Density of water, kg/m3";
	parameter Real nu_o = 100e-6 "Kinematic viscosity oil, m2/s";
	parameter Real nu_w = 1e-6 "Kinematic viscosity water, m2/s";
	parameter Real eps = 45.7e-6 "Pipe roughness dimension, m";
	parameter Real h_p_sig = 1210.6 "Pump scaling head, m";
	parameter Real f_p_0 = 60 "Nominal pump frequency, Hz";
	parameter Real Vd_p_sig = 1 "Pump scaling volumetric flowrate, m3/s";
	parameter Real a1 = -37.57 "ESP parameter, -";
	parameter Real a2 = 2.864e3 "ESP parameter, -";
	parameter Real a3 = -8.668e4 "ESP parameter, -";
	parameter Real C_md = 25.9e3/3600 "Valve capacity, m3/s";
	parameter Real p_v_sig = 1e5 "Valve pressure scaling, Pa";
	parameter Real rho_v_sig = 1e3 "Valve fluid density scaling, kg/m3";
	parameter Real C_Vd_pi = 7e-4 "Productivity index constant, m3/s";
	parameter Real p_pi_sig = 1e5 "Productivity index scaled pressure, Pa";
	
	// Initial state parameters
	parameter Real Vd_v0 = 23.15e-3 "Initial vertical pipe flowrate, m3/s";
	//
	// Declaring variables
	// -- differential variables
	Real Vd_v(start = Vd_v0, fixed = true) "Initializing vertical flow rate, m3/s";
	// -- depending on inputs
	Real rho_beta_0 "Mixture density";
	Real nu "Mixture viscosity, m2/s";
	Real mu "Mixture dynamic viscosity, ";
	// -- algebraic variables
	Real p_c_i "Choke inlet pressure, Pa";
	Real p_h "Heel pressure, Pa";
	Real md_v "Vertical pipe mass flow rate, kg/s";

	Real rho_v "Vertical pipe density, kg/m3";
	Real v_v "Vertical pipe linear velocity, m/s";
	
	Real dp_p "Pump pressure increase, Pa";
	Real dp_f "Friction pressure drop, Pa";
	Real h_p "Pump head, m";
	Real fD "Darcy friction factor,-";
	Real NRe "Reynolds number, -";
	Real dp_g "Gravity pressure, Pa";
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
	der(Vd_v) = A*(p_h - p_c_i + dp_p - dp_f - rho_v*g*h)/(rho_v*ell);
	// Algebraic equations
	// -- depending on inputs
	rho_beta_0 = chi_w*rho_w + (1-chi_w)*rho_o;
	nu = chi_w*nu_w + (1-chi_w)*nu_o;
	mu = rho_beta_0*nu;
	//
	rho_v = rho_beta_0*exp(beta_T*(p_c_i-p_beta_0));
	
	p_h = p_f - p_pi_sig*Vd_v/C_Vd_pi;
	md_v = rho_v*Vd_v;
	p_c_i = p_m + p_v_sig*rho_v/rho_v_sig*(md_v/C_md)^2;
	h_p = h_p_sig*( (f_p/f_p_0)^2 + a1*(f_p/f_p_0)*Vd_v/Vd_p_sig
			+ a2*(Vd_v/Vd_p_sig)^2 + a3*(f_p_0/f_p)*(Vd_v/Vd_p_sig)^3);
	dp_p = rho_v*g*h_p;
	v_v = Vd_v/A;
	NRe = rho_v*v_v*d/mu;
	fD = (-1/2/log10(5.74/NRe^0.9 + eps/d/3.7))^2;
	dp_f = ell*fD*rho_v/2*v_v^2/d;
	dp_g = rho_v*g*h;
	//
  end Mod_Reservoir_2_Manifold;
