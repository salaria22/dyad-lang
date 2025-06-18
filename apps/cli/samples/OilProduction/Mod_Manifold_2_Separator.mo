  model Mod_Manifold_2_Separator
    // Model of Horizontal Transport Pipe to Separator
    // author: 	Bernt Lie
    //			University of South-Eastern Norway
	//			December 15, 2023
	//
	// Parameters
	constant Real PI = 3.151592654;
	constant Real g = 9.81 "Acceleration of gravity, m/s2";
	//
	parameter Real ell = 4000 "Length of horizontal transport pipe, m";
	parameter Real d = 0.1569 "Horizontal transport pipe diameter, m";
	parameter Real A = PI*d^2/4 "Horizontal pipe cross sectional area, m2";
	parameter Real V = A*ell "Volume of horizontal pipe, m3";
	parameter Real beta_T = 1/1.5e9 "Isothermal compressibility of fluid, 1/Pa";
	parameter Real p_beta_0 = 1e5 "Nominal fluid pressure, Pa";
	parameter Real rho_o = 900 "Density of oil, kg/m3";
	parameter Real rho_w = 1e3 "Density of water, kg/m3";
	parameter Real nu_o = 100e-6 "Kinematic viscosity oil, m2/s";
	parameter Real nu_w = 1e-6 "Kinematic viscosity water, m2/s";
	parameter Real eps = 45.7e-6 "Pipe roughness dimension, m";
	parameter Real Dp__s = 10e5 "Booster pump scaling pressure, Pa";
	parameter Real f_bp__0 = 60 "Nominal booster pump frequency, Hz";
	
	// Initial state parameters
	parameter Real Vd_0 = 2*23.15e-3 "Initial vertical pipe flowrate, m3/s";
	//
	// Declaring variables
	// -- differential variables
	Real Vd(start = Vd_0, fixed = true) "Initializing horizontal flow rate, m3/s";
	// -- depending on inputs
	Real rho_beta_0 "Mixture density, kg/m3";
	Real nu "Mixture kinematic viscosity, m2/s";
	Real mu "Mixture dynamic viscosity, Pa.s";
	// -- algebraic variables
	Real m "Mass in transport pipe, kg";
	Real rho "Density in transport pipe, kg/m3";
	Real F_p "Pressure force, N";
	Real F_bp "Booster pump force, N";
	Real F_f "Friction force, N";
	Real F	"Total force, N";
	
	Real Dp_bp "Booster pump pressure increase, Pa";
	Real v "Velocity in transport pipe, m/s";
	Real N_Re "Reynolds number in transport pipe, -";
	Real f_D "Darcy friction factor in transport pipe, -";
	Real Dp_f "Friction pressure drop in transport pipe, Pa";
	//
	// -- input variables
	input Real p_m "Manifold pressure, Pa";
	input Real p_s "Separator pressure, Pa";
	input Real f_bp "Booster pump frequency, Hz";
	input Real chi_w "Water cut in transport pipe, -";
	//input Real u_c "Choke valve opening, -";
  // Equations constituting the model
  equation
	// Balance equations
	der(Vd) = A*(p_m - p_s + Dp_bp - Dp_f)/(rho*ell);
	// Algebraic equations
	// -- depending on inputs
	rho_beta_0 = chi_w*rho_w + (1-chi_w)*rho_o;
	nu = chi_w*nu_w + (1-chi_w)*nu_o;
	mu = rho_beta_0*nu;
	// -- related to mass balance
	m = rho*V;
	rho = rho_beta_0*exp(beta_T*(p_m-p_beta_0));
	// -- related to momentum balance
	F_p = A*(p_m-p_s);
	F_bp = A*Dp_bp;
	F_f = A*Dp_f;
	F = F_p + F_bp - F_f;

	Dp_bp = Dp__s*(f_bp/f_bp__0);
	v = Vd/A;
	N_Re = rho*v*d/mu;
	f_D = (-1/2/log10(5.74/N_Re^0.9 + eps/d/3.7))^2;
	Dp_f = ell*f_D*rho/2*v^2/d;
	//
  end Mod_Manifold_2_Separator;
